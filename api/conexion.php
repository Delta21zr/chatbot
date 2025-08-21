<?php
header('Content-Type: application/json; charset=utf-8');

$conexion = new mysqli("localhost", "root", "", "chatbot");
$conexion->set_charset("utf8");

if ($conexion->connect_error) {
    echo json_encode([
        "status" => "error",
        "message" => "Error de conexión: " . $conexion->connect_error
    ]);
    exit;
}

echo json_encode([
    "status" => "success",
    "message" => "Conexión establecida correctamente"
]);
?>
