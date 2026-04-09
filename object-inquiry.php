<?php
require 'mailer-common.php';

header('Content-Type: application/json');

session_start();

if(isset($_SESSION['t']) && time() - $_SESSION['t'] < 5){
  echo json_encode(['success'=>false]);
  exit;
}
$_SESSION['t'] = time();

$name = $_POST['name'] ?? '';
$email = $_POST['email'] ?? '';
$msg = $_POST['message'] ?? '';
$title = $_POST['objekt_titel'] ?? '';

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

  $mail->Subject = "Objektanfrage: $title";
  $mail->Body = "Name: $name\nEmail: $email\n\n$msg";

  $mail->send();

  echo json_encode(['success'=>true]);

}catch(Exception $e){
  echo json_encode(['success'=>false]);
}
