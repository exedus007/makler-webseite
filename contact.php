<?php
require 'mailer-common.php';

header('Content-Type: application/json');

session_start();

/* Rate Limit */
if(isset($_SESSION['t']) && time() - $_SESSION['t'] < 5){
  echo json_encode(['success'=>false,'message'=>'Bitte kurz warten']);
  exit;
}
$_SESSION['t'] = time();

/* Honeypot */
if(!empty($_POST['website'])){
  echo json_encode(['success'=>true]);
  exit;
}

/* Daten */
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$msg = trim($_POST['message'] ?? '');
$privacy = $_POST['privacy'] ?? '';

if(!$name || !$email || !$msg || !$privacy){
  echo json_encode(['success'=>false,'message'=>'Pflichtfelder fehlen']);
  exit;
}

if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
  echo json_encode(['success'=>false,'message'=>'Ungültige E-Mail']);
  exit;
}

/* Mail */
use PHPMailer\PHPMailer\PHPMailer;
require 'PHPMailer/src/PHPMailer.php';

$c = config();
$mail = new PHPMailer(true);

try{
  $mail->isSMTP();
  $mail->Host = $c['host'];
  $mail->SMTPAuth = true;
  $mail->Username = $c['user'];
  $mail->Password = $c['pass'];
  $mail->Port = $c['port'];

  $mail->setFrom($c['from']);
  $mail->addAddress($c['from']);

  $mail->Subject = "Neue Anfrage";
  $mail->Body = "Name: $name\nEmail: $email\n\n$msg";

  $mail->send();

  echo json_encode(['success'=>true]);

}catch(Exception $e){
  error_log($e->getMessage());
  echo json_encode(['success'=>false]);
}
