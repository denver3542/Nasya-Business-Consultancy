<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $headline }}</title>
</head>
<body style="font-family: Arial, sans-serif; color: #111827;">
    <h2>{{ $headline }}</h2>
    <p>{{ $body }}</p>
    <p><strong>Application Number:</strong> {{ $application->application_number }}</p>
    <p><strong>Current Status:</strong> {{ $application->status->name }}</p>
</body>
</html>

