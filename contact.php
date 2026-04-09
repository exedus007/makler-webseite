<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';
require __DIR__ . '/mailer-common.php';

ensurePostRequest();
validateSameOriginRequest();
enforceRateLimit('contact-form', 5, 300);

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

$settings = getMailSettings();

$adminBody = <<<TEXT
Neue Kontaktanfrage über die Webseite

Name: {$name}
E-Mail: {$email}
Telefon: {$phone}
Betreff: {$subject}

Nachricht:
{$message}
TEXT;

$customerSubject = 'Ihre Anfrage bei ' . $settings['companyName'];

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
{$settings['companyName']}
TEXT;

try {
    $adminMailer = createConfiguredMailer();
    $adminMailer->setFrom($settings['fromEmail'], $settings['fromName']);
    $adminMailer->addAddress($settings['receiverEmail'], $settings['receiverName']);
    $adminMailer->addReplyTo($email, $name);
    $adminMailer->Subject = 'Neue Kontaktanfrage: ' . $subject;
    $adminMailer->Body = $adminBody;
    $adminMailer->isHTML(false);
    $adminMailer->send();

    $customerMailer = createConfiguredMailer();
    $customerMailer->setFrom($settings['fromEmail'], $settings['companyName']);
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
    appLog('Fehler beim Versand der Kontaktanfrage.', [
        'message' => $e->getMessage(),
        'email' => $email,
        'subject' => $subject
    ]);

    respond(500, [
        'success' => false,
        'message' => 'Beim Versand der E-Mail ist ein Fehler aufgetreten.'
    ]);
}
