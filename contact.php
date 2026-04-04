<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

function respond(int $statusCode, array $data): void
{
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [
        'success' => false,
        'message' => 'Ungültige Anfrage.'
    ]);
}

function clean(string $value): string
{
    return trim($value);
}

$name = clean($_POST['name'] ?? '');
$email = clean($_POST['email'] ?? '');
$phone = clean($_POST['phone'] ?? '');
$subject = clean($_POST['subject'] ?? '');
$message = clean($_POST['message'] ?? '');
$privacy = $_POST['privacy'] ?? '';
$honeypot = clean($_POST['website'] ?? '');

if ($honeypot !== '') {
    respond(200, [
        'success' => true,
        'message' => 'Vielen Dank. Ihre Anfrage wurde empfangen.'
    ]);
}

if ($name === '' || $email === '' || $message === '') {
    respond(422, [
        'success' => false,
        'message' => 'Bitte füllen Sie alle Pflichtfelder aus.'
    ]);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, [
        'success' => false,
        'message' => 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
    ]);
}

if ($privacy === '') {
    respond(422, [
        'success' => false,
        'message' => 'Bitte bestätigen Sie die Datenschutzhinweise.'
    ]);
}

if ($subject === '') {
    $subject = 'Allgemeine Kontaktanfrage';
}

/*
|--------------------------------------------------------------------------
| SMTP-EINSTELLUNGEN SPÄTER FÜR IONOS ANPASSEN
|--------------------------------------------------------------------------
*/
$smtpHost = 'smtp.ionos.de';
$smtpPort = 587;
$smtpSecure = PHPMailer::ENCRYPTION_STARTTLS;
$smtpUsername = 'info@deine-domain.de';
$smtpPassword = 'HIER_IHR_EMAIL_PASSWORT_EINTRAGEN';

$companyName = 'Deisterblick Immobilien';
$receiverEmail = 'info@deine-domain.de';
$receiverName = 'Deisterblick Immobilien';

$fromEmail = 'info@deine-domain.de';
$fromName = 'Deisterblick Immobilien Website';

$customerSubject = 'Ihre Anfrage bei Deisterblick Immobilien';

$adminBody = <<<TEXT
Neue Kontaktanfrage über die Webseite

Name: {$name}
E-Mail: {$email}
Telefon: {$phone}
Betreff: {$subject}

Nachricht:
{$message}
TEXT;

$customerBody = <<<TEXT
Guten Tag {$name},

vielen Dank für Ihre Nachricht.

Wir haben Ihre Anfrage erhalten und melden uns schnellstmöglich bei Ihnen zurück.

Ihre Angaben:
Name: {$name}
E-Mail: {$email}
Telefon: {$phone}
Betreff: {$subject}

Freundliche Grüße
{$companyName}
TEXT;

try {
    $adminMailer = new PHPMailer(true);
    $adminMailer->isSMTP();
    $adminMailer->Host = $smtpHost;
    $adminMailer->SMTPAuth = true;
    $adminMailer->Username = $smtpUsername;
    $adminMailer->Password = $smtpPassword;
    $adminMailer->SMTPSecure = $smtpSecure;
    $adminMailer->Port = $smtpPort;
    $adminMailer->CharSet = 'UTF-8';

    $adminMailer->setFrom($fromEmail, $fromName);
    $adminMailer->addAddress($receiverEmail, $receiverName);
    $adminMailer->addReplyTo($email, $name);

    $adminMailer->Subject = 'Neue Kontaktanfrage: ' . $subject;
    $adminMailer->Body = $adminBody;
    $adminMailer->isHTML(false);
    $adminMailer->send();

    $customerMailer = new PHPMailer(true);
    $customerMailer->isSMTP();
    $customerMailer->Host = $smtpHost;
    $customerMailer->SMTPAuth = true;
    $customerMailer->Username = $smtpUsername;
    $customerMailer->Password = $smtpPassword;
    $customerMailer->SMTPSecure = $smtpSecure;
    $customerMailer->Port = $smtpPort;
    $customerMailer->CharSet = 'UTF-8';

    $customerMailer->setFrom($fromEmail, $companyName);
    $customerMailer->addAddress($email, $name);

    $customerMailer->Subject = $customerSubject;
    $customerMailer->Body = $customerBody;
    $customerMailer->isHTML(false);
    $customerMailer->send();

    respond(200, [
        'success' => true,
        'message' => 'Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet.'
    ]);
} catch (Exception $e) {
    respond(500, [
        'success' => false,
        'message' => 'Beim Versand der E-Mail ist ein Fehler aufgetreten.'
    ]);
}
