<?php
header('Content-Type: application/json; charset=utf-8');

// Conexiones y modelos
require_once "modelos/conexion.php";
require_once "modelos/saludo.php";
require_once "modelos/intencion.php";
require_once "modelos/pedido.php";
require_once "modelos/usuarios.php";

// Función para extraer entidad pedido
function extraerEntidadPedido($mensaje) {
    $pattern = '/PED\d+/i';
    if (preg_match($pattern, $mensaje, $matches)) {
        return strtoupper($matches[0]);
    }
    return null;
}

$mensaje = strtolower(trim($_POST['mensaje'] ?? ''));
$usuario_id = 1; 
$usuario = obtenerUsuarioPorId($usuario_id, $conexion);
$nombreUsuario = $usuario ? $usuario['nombre'] : 'Usuario';

// Leer el contexto anterior
$sql_contexto = "SELECT intencion_actual FROM contexto_chat WHERE usuario_id = $usuario_id";
$result_contexto = $conexion->query($sql_contexto);
$intencion_anterior = ($result_contexto && $result_contexto->num_rows > 0) ? $result_contexto->fetch_assoc()['intencion_actual'] : null;

// Actualizar última interacción
if ($usuario) {
    actualizarUltimaInteraccion($usuario_id, $conexion);
}

$respuesta = detectarSaludo($mensaje, $conexion);
$no_puede_resolver = false;

if (!$respuesta) {
    $intencion = detectarIntencion($mensaje, $conexion);

    if ($intencion) {
        $fecha = date('Y-m-d H:i:s');
        $conexion->query("REPLACE INTO contexto_chat (usuario_id, intencion_actual, ultima_fecha) VALUES ($usuario_id, '$intencion', '$fecha')");

        // Manejo especial para la intención "ayuda" y sus sub-intenciones según contexto
        if ($intencion === "ayuda" && $intencion_anterior === "ayuda") {
            // Interpretamos mensaje como subcategoría de ayuda
            if (strpos($mensaje, 'soporte') !== false) {
                $respuesta = "Entendido $nombreUsuario, veo que necesitas soporte técnico. Por favor dime cuál es el problema y lo atenderemos.";
            } elseif (strpos($mensaje, 'pedido') !== false) {
                $respuesta = "Perfecto $nombreUsuario, ¿qué problema tienes con tu pedido?";
            } elseif (strpos($mensaje, 'reembolso') !== false) {
                $respuesta = "Para gestionar un reembolso $nombreUsuario, dime por favor el código del pedido.";
            } else {
                $respuesta = "Claro $nombreUsuario, ¿necesitas ayuda con un pedido, un reembolso o soporte técnico?";
            }
        } else {
            // Flujos normales por intención
            switch($intencion) {
                case "saludo":
                    $respuesta = "¡Hola $nombreUsuario! ¿En qué puedo ayudarte?";
                    break;

                case "ayuda":
                    $respuesta = "Claro $nombreUsuario, ¿necesitas ayuda con un pedido, un reembolso o soporte técnico?";
                    break;

                case "pedido":
                    $codigoPedido = extraerEntidadPedido($mensaje);
                    if ($codigoPedido) {
                        $pedido = obtenerPedidoPorCodigo($codigoPedido, $conexion);
                        if ($pedido) {
                            $respuesta = [
                                "mensaje" => "Aquí está la información del pedido $codigoPedido:",
                                "pedido" => $pedido
                            ];
                        } else {
                            $respuesta = "No encontré información para el pedido $codigoPedido.";
                            $no_puede_resolver = true;
                        }
                    } else {
                        $pedidos = obtenerPedidos($usuario_id, $conexion);
                        if (count($pedidos) > 0) {
                            $respuesta = [
                                "mensaje" => "Hola $nombreUsuario, estos son tus pedidos recientes:",
                                "pedidos" => $pedidos
                            ];
                        } else {
                            $respuesta = "Hola $nombreUsuario, no tienes pedidos registrados.";
                            $no_puede_resolver = true;
                        }
                    }
                    break;

                case "reembolso":
                    $respuesta = "Para gestionar un reembolso $nombreUsuario, dime por favor el código del pedido.";
                    break;

                case "soporte":
                    $respuesta = "Entendido $nombreUsuario, veo que necesitas soporte técnico. Por favor dime cuál es el problema y lo atenderemos.";
                    break;

                default:
                    $respuesta = "Hola $nombreUsuario, no tengo aún una respuesta programada para esa consulta.";
                    $no_puede_resolver = true;
                    break;
            }
        }
    } else {
        $respuesta = "Lo siento $nombreUsuario, no entendí tu mensaje.";
        $no_puede_resolver = true;
    }

    // Registrar solicitud para operador si no se pudo resolver
    if ($no_puede_resolver) {
        $fecha = date('Y-m-d H:i:s');
        $motivo = "No se pudo resolver la consulta automáticamente";
        $estado = "pendiente";

        $sql = "INSERT INTO contactos_operador (usuario_id, fecha, motivo, estado) 
                VALUES ($usuario_id, '$fecha', '$motivo', '$estado')";
        $conexion->query($sql);

        $respuesta = "No pude resolver tu consulta, te conecto con un operador.";
    }
}

echo json_encode($respuesta);
