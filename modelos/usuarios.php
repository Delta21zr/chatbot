<?php
include 'conexion.php';

function obtenerUsuarioPorId($usuario_id, $conexion) {
    $sql = "SELECT * FROM usuarios WHERE id = $usuario_id";
    $result = $conexion->query($sql);

    if ($result && $result->num_rows > 0) {
        return $result->fetch_assoc();
    } else {
        return null;
    }
}

function actualizarUltimaInteraccion($usuario_id, $conexion) {
    $sql = "UPDATE usuarios SET ultima_interaccion = NOW() WHERE id = $usuario_id";
    $conexion->query($sql);
}
?>
