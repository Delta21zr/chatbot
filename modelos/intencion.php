<?php
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
?>
