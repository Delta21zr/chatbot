<?php
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

$mensaje = strtolower(trim($_POST['mensaje'] ?? ''));

function detectarSaludo($mensaje, $conexion) {
    $sql = "SELECT mensaje FROM saludos";
    $result = $conexion->query($sql);

    while ($row = $result->fetch_assoc()) {
        if (strpos(strtolower($mensaje), strtolower($row['mensaje'])) !== false) {
            return "Hola soy el asistente de black lotus";
        }
    }

    return null;
}

$respuesta = detectarSaludo($mensaje, $conexion);

echo json_encode([
    "mensaje" => $mensaje,
    "respuesta" => $respuesta ?? "No se detectó saludo"
]);
?>
