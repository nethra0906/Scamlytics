import networkx as nx
from pyvis.network import Network
import os

def build_fraud_graph(transactions: list):
    """
    transactions: list of dicts with phone_number, device_id, account_id, amount
    """
    G = nx.Graph()

    for t in transactions:
        phone = f"PHONE:{t['phone_number']}"
        device = f"DEVICE:{t['device_id']}"
        account = f"ACCOUNT:{t['account_id']}"

        G.add_node(phone, type="phone")
        G.add_node(device, type="device")
        G.add_node(account, type="account")

        G.add_edge(phone, device, weight=G.get_edge_data(phone, device, {}).get("weight", 0) + 1)
        G.add_edge(device, account, weight=G.get_edge_data(device, account, {}).get("weight", 0) + 1)
        G.add_edge(phone, account, weight=G.get_edge_data(phone, account, {}).get("weight", 0) + 1)

    components = list(nx.connected_components(G))
    clusters = []
    for idx, comp in enumerate(components):
        subgraph = G.subgraph(comp)
        size = len(comp)
        # Heuristic: clusters sharing 1 device/account across 3+ distinct phones = suspicious
        phone_count = sum(1 for n in comp if n.startswith("PHONE:"))
        device_count = sum(1 for n in comp if n.startswith("DEVICE:"))
        account_count = sum(1 for n in comp if n.startswith("ACCOUNT:"))

        is_suspicious = (phone_count >= 3 and (device_count == 1 or account_count == 1)) or size >= 6

        clusters.append({
            "cluster_id": idx,
            "size": size,
            "phone_count": phone_count,
            "device_count": device_count,
            "account_count": account_count,
            "is_suspicious": is_suspicious,
            "nodes": list(comp),
        })

    return G, clusters

def graph_to_html(G, clusters, out_path):
    net = Network(height="600px", width="100%", bgcolor="#0f172a", font_color="white")
    suspicious_nodes = set()
    for c in clusters:
        if c["is_suspicious"]:
            suspicious_nodes.update(c["nodes"])

    color_map = {"phone": "#3b82f6", "device": "#a855f7", "account": "#22c55e"}

    for node, data in G.nodes(data=True):
        color = "#ef4444" if node in suspicious_nodes else color_map.get(data.get("type"), "#94a3b8")
        net.add_node(node, label=node.split(":")[1][:10], color=color, title=node)

    for u, v, data in G.edges(data=True):
        net.add_edge(u, v, value=data.get("weight", 1))

    net.set_options("""
    var options = {
      "physics": { "stabilization": true, "barnesHut": {"gravitationalConstant": -3000} }
    }
    """)
    net.write_html(out_path)
    return out_path