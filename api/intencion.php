<?php
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

$mensaje = strtolower(trim($_POST['mensaje'] ?? ''));

function detectarIntencion($mensaje, $conexion) {
    $sql = "SELECT palabras_clave.palabra, intenciones.nombre 
            FROM palabras_clave
            JOIN intenciones ON palabras_clave.intencion_id = intenciones.id";

    $result = $conexion->query($sql);

    while ($row = $result->fetch_assoc()) {
        if (strpos(strtolower($mensaje), strtolower($row['palabra'])) !== false) {
            return $row['nombre'];
        }
    }
    return null;
}

$respuesta = detectarIntencion($mensaje, $conexion);

echo json_encode([
    "mensaje" => $mensaje,
    "intencion" => $respuesta ?? "No se detectó intención"
]);
?>
