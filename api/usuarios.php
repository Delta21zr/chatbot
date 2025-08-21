<?php
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

$usuario_id = intval($_POST['usuario_id'] ?? 0);

function obtenerUsuarioPorId($usuario_id, $conexion) {
    $sql = "SELECT * FROM usuarios WHERE id = $usuario_id";
    $result = $conexion->query($sql);

    return ($result && $result->num_rows > 0) ? $result->fetch_assoc() : null;
}

function actualizarUltimaInteraccion($usuario_id, $conexion) {
    $sql = "UPDATE usuarios SET ultima_interaccion = NOW() WHERE id = $usuario_id";
    $conexion->query($sql);
}

$usuario = obtenerUsuarioPorId($usuario_id, $conexion);

if ($usuario) {
    actualizarUltimaInteraccion($usuario_id, $conexion);
    echo json_encode([
        "status" => "success",
        "usuario" => $usuario
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Usuario no encontrado"
    ]);
}
?>
