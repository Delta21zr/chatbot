<?php
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

$usuario_id = intval($_POST['usuario_id'] ?? 0);

function obtenerPedidos($usuario_id, $conexion) {
    $sql = "SELECT codigo_pedido, fecha, estado, total
            FROM pedidos
            WHERE usuario_id = $usuario_id
            ORDER BY fecha DESC
            LIMIT 5";

    $result = $conexion->query($sql);

    $pedidos = [];
    while ($row = $result->fetch_assoc()) {
        $pedidos[] = $row;
    }
    return $pedidos;
}

$pedidos = obtenerPedidos($usuario_id, $conexion);

echo json_encode([
    "usuario_id" => $usuario_id,
    "pedidos" => $pedidos
]);
?>
