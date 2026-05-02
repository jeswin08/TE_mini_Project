"""Graph-based relationship analysis for fraud detection."""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Tuple

try:
    import networkx as nx

    _GRAPH_AVAILABLE = True
except Exception:  # pragma: no cover - dependency fallback
    nx = None
    _GRAPH_AVAILABLE = False


def build_relationship_graph(transactions: Iterable[Dict[str, Any]]) -> nx.Graph:
    """Build a bipartite-style graph between users, devices, and merchants."""
    if not _GRAPH_AVAILABLE or nx is None:
        return None

    graph = nx.Graph()

    for txn in transactions:
        user_id = str(txn.get("user_id", "")).strip()
        device_id = str(txn.get("device_id", "")).strip()
        merchant = str(txn.get("merchant", "")).strip()

        if not user_id:
            continue

        user_node = f"user:{user_id}"
        graph.add_node(user_node, node_type="user")

        if device_id:
            device_node = f"device:{device_id}"
            graph.add_node(device_node, node_type="device")
            graph.add_edge(user_node, device_node)

        if merchant:
            merchant_node = f"merchant:{merchant.lower()}"
            graph.add_node(merchant_node, node_type="merchant")
            graph.add_edge(user_node, merchant_node)

    return graph


def detect_suspicious_connections(
    current_transaction: Dict[str, Any],
    recent_transactions: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Detect suspicious relationship patterns and return graph risk indicators."""
    if not _GRAPH_AVAILABLE or nx is None:
        return {"graph_risk_score": 0.0, "suspicious_links": []}

    graph = build_relationship_graph(recent_transactions)

    user_id = str(current_transaction.get("user_id", "")).strip()
    device_id = str(current_transaction.get("device_id", "")).strip()
    merchant = str(current_transaction.get("merchant", "")).strip().lower()

    if not user_id:
        return {"graph_risk_score": 0.0, "suspicious_links": []}

    suspicious_links: List[str] = []
    score = 0.0

    user_node = f"user:{user_id}"
    device_node = f"device:{device_id}" if device_id else ""
    merchant_node = f"merchant:{merchant}" if merchant else ""

    if device_node and graph is not None and graph.has_node(device_node):
        linked_users = [node for node in graph.neighbors(device_node) if node.startswith("user:")]
        if len(linked_users) >= 3 and user_node not in linked_users:
            score += 12.0
            suspicious_links.append("shared_device_cluster")

    if merchant_node and graph is not None and graph.has_node(merchant_node):
        linked_users = [node for node in graph.neighbors(merchant_node) if node.startswith("user:")]
        if len(linked_users) >= 8 and user_node not in linked_users:
            score += 8.0
            suspicious_links.append("merchant_ring_pattern")

    if (
        graph is not None
        and device_node
        and merchant_node
        and graph.has_node(device_node)
        and graph.has_node(merchant_node)
    ):
        try:
            shortest_path = nx.shortest_path_length(graph, device_node, merchant_node)
            if shortest_path <= 2:
                score += 5.0
                suspicious_links.append("dense_device_merchant_link")
        except nx.NetworkXNoPath:
            pass

    return {
        "graph_risk_score": round(min(score, 25.0), 2),
        "suspicious_links": suspicious_links,
    }


def extract_recent_relationships(user_id: str, lookback_transactions: int = 300) -> List[Dict[str, Any]]:
    """Load recent transactions for relationship graph analysis from the database."""
    from database.models import Transaction

    transactions = (
        Transaction.query.order_by(Transaction.timestamp.desc()).limit(max(lookback_transactions, 50)).all()
    )

    data: List[Dict[str, Any]] = []
    for txn in transactions:
        data.append(
            {
                "user_id": txn.user_id,
                "device_id": txn.device_id,
                "merchant": txn.merchant,
            }
        )

    data.append(
        {
            "user_id": user_id,
            "device_id": "",
            "merchant": "",
        }
    )
    return data
