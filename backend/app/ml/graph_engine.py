"""
graph_engine.py — Fraud graph engine.

Improvements:
  - rebuild_from_transactions() method for startup auto-rebuild
  - Singleton exposed via get_graph_repo()
  - NetworkX in-memory graph with pyvis HTML export
"""
import logging
import networkx as nx
from pyvis.network import Network
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class GraphRepository(ABC):
    @abstractmethod
    def build_fraud_graph(self, transactions: list):
        pass

    @abstractmethod
    def graph_to_html(self, out_path: str):
        pass

    @abstractmethod
    def query(self, query_string: str):
        pass

    @abstractmethod
    def rebuild_from_transactions(self, transactions: list):
        """Rebuild graph from a list of transaction dicts (called on startup)."""
        pass


class NetworkXGraphRepository(GraphRepository):
    def __init__(self):
        self.G = nx.Graph()
        self.clusters: list = []

    def rebuild_from_transactions(self, transactions: list):
        """
        Called at startup to restore the in-memory graph from persisted DB data.
        Identical to build_fraud_graph but logs at INFO level.
        """
        logger.info("Rebuilding fraud graph from %d persisted transactions…", len(transactions))
        G, clusters = self.build_fraud_graph(transactions)
        logger.info(
            "Graph rebuilt — nodes: %d, edges: %d, clusters: %d (suspicious: %d)",
            G.number_of_nodes(),
            G.number_of_edges(),
            len(clusters),
            sum(1 for c in clusters if c["is_suspicious"]),
        )
        return G, clusters

    def build_fraud_graph(self, transactions: list):
        self.G = nx.Graph()
        for t in transactions:
            phone   = f"PHONE:{t['phone_number']}"
            device  = f"DEVICE:{t['device_id']}"
            account = f"ACCOUNT:{t['account_id']}"

            self.G.add_node(phone,   type="phone")
            self.G.add_node(device,  type="device")
            self.G.add_node(account, type="account")

            for u, v in [(phone, device), (device, account), (phone, account)]:
                w = self.G.get_edge_data(u, v, {}).get("weight", 0)
                self.G.add_edge(u, v, weight=w + 1)

        components = list(nx.connected_components(self.G))
        self.clusters = []
        for idx, comp in enumerate(components):
            size          = len(comp)
            phone_count   = sum(1 for n in comp if n.startswith("PHONE:"))
            device_count  = sum(1 for n in comp if n.startswith("DEVICE:"))
            account_count = sum(1 for n in comp if n.startswith("ACCOUNT:"))
            is_suspicious = (
                (phone_count >= 3 and (device_count == 1 or account_count == 1))
                or size >= 6
            )
            self.clusters.append({
                "cluster_id": idx,
                "size": size,
                "phone_count": phone_count,
                "device_count": device_count,
                "account_count": account_count,
                "is_suspicious": is_suspicious,
                "nodes": list(comp),
            })
        return self.G, self.clusters

    def graph_to_html(self, out_path: str):
        net = Network(height="600px", width="100%", bgcolor="#06090e", font_color="#f8fafc")
        suspicious_nodes: set = set()
        for c in self.clusters:
            if c["is_suspicious"]:
                suspicious_nodes.update(c["nodes"])

        color_map = {"phone": "#3b82f6", "device": "#a855f7", "account": "#22c55e"}

        for node, data in self.G.nodes(data=True):
            color = "#ff3b30" if node in suspicious_nodes else color_map.get(data.get("type"), "#94a3b8")
            net.add_node(node, label=node.split(":")[1][:10], color=color, title=node)

        for u, v, data in self.G.edges(data=True):
            net.add_edge(u, v, value=data.get("weight", 1))

        net.set_options("""
        var options = {
          "physics": { "stabilization": true, "barnesHut": {"gravitationalConstant": -3000} },
          "nodes": { "borderWidth": 2, "shadow": true },
          "edges": { "smooth": { "type": "continuous" } }
        }
        """)
        net.write_html(out_path)
        return out_path

    def query(self, query_string: str):
        if "COUNT(N)" in query_string.upper():
            return {"result": f"Nodes: {self.G.number_of_nodes()}, Edges: {self.G.number_of_edges()}"}
        if "SUSPICIOUS" in query_string.upper():
            return {"result": f"Found {sum(1 for c in self.clusters if c['is_suspicious'])} suspicious clusters"}
        return {"result": "Query executed via NetworkX fallback. Neo4j driver not active."}


# ── Singleton ─────────────────────────────────────────────────────────────────

_graph_repo = NetworkXGraphRepository()


def get_graph_repo() -> GraphRepository:
    return _graph_repo