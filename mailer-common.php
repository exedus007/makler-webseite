<?php
function env($key, $default = null) {
  $value = getenv($key);
  return $value !== false ? $value : $default;
}

function config() {
  return [
    'host' => env('MAIL_HOST', 'smtp.ionos.de'),
    'port' => env('MAIL_PORT', 587),
    'user' => env('MAIL_USERNAME'),
    'pass' => env('MAIL_PASSWORD'),
    'from' => env('FROM_EMAIL', 'info@test.de')
  ];
}
