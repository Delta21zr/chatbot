<?php
function detectarSaludo($mensaje, $conexion) {
    $sql = "SELECT mensaje FROM saludos";
    $result = $conexion->query($sql);

    while ($row = $result->fetch_assoc()) {
        if (strpos(strtolower($mensaje), strtolower($row['mensaje'])) !== false) {
            return "¡Hola! ¿En qué puedo ayudarte?";
        }
    }

    return null;
}
?>
