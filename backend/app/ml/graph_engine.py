import networkx as nx
from pyvis.network import Network
from abc import ABC, abstractmethod
import os

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

class NetworkXGraphRepository(GraphRepository):
    def __init__(self):
        self.G = nx.Graph()
        self.clusters = []

    def build_fraud_graph(self, transactions: list):
        self.G = nx.Graph()
        for t in transactions:
            phone = f"PHONE:{t['phone_number']}"
            device = f"DEVICE:{t['device_id']}"
            account = f"ACCOUNT:{t['account_id']}"

            self.G.add_node(phone, type="phone")
            self.G.add_node(device, type="device")
            self.G.add_node(account, type="account")

            self.G.add_edge(phone, device, weight=self.G.get_edge_data(phone, device, {}).get("weight", 0) + 1)
            self.G.add_edge(device, account, weight=self.G.get_edge_data(device, account, {}).get("weight", 0) + 1)
            self.G.add_edge(phone, account, weight=self.G.get_edge_data(phone, account, {}).get("weight", 0) + 1)

        components = list(nx.connected_components(self.G))
        self.clusters = []
        for idx, comp in enumerate(components):
            size = len(comp)
            phone_count = sum(1 for n in comp if n.startswith("PHONE:"))
            device_count = sum(1 for n in comp if n.startswith("DEVICE:"))
            account_count = sum(1 for n in comp if n.startswith("ACCOUNT:"))

            is_suspicious = (phone_count >= 3 and (device_count == 1 or account_count == 1)) or size >= 6

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
        suspicious_nodes = set()
        for c in self.clusters:
            if c["is_suspicious"]:
                suspicious_nodes.update(c["nodes"])

        # Command Center Theme colors
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
        # Cypher-lite mock endpoint over NetworkX
        if "COUNT(n)" in query_string.upper():
            return {"result": f"Nodes: {self.G.number_of_nodes()}, Edges: {self.G.number_of_edges()}"}
        if "SUSPICIOUS" in query_string.upper():
            return {"result": f"Found {sum(1 for c in self.clusters if c['is_suspicious'])} suspicious clusters"}
        return {"result": "Query executed via NetworkX fallback. Neo4j driver not active."}

# Singleton instance
_graph_repo = NetworkXGraphRepository()

def get_graph_repo() -> GraphRepository:
    return _graph_repo