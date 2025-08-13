<?php
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
?>
