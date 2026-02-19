<?php

use App\Actions\Legacy\LegacyApplicationTransformer;

test('it builds normalized form data from dynamic rows', function () {
    $transformer = new LegacyApplicationTransformer;

    $formData = $transformer->buildFormData([
        'id' => 1,
        'task_id' => 24010,
        'Date of Application 2025' => '2025-02-05',
        'reminder_2025' => '  Follow up with client  ',
        'empty_value' => '',
        'null_value' => 'NULL',
    ]);

    expect($formData)->toBe([
        'date_of_application_2025' => '2025-02-05',
        'empty_value' => null,
        'null_value' => null,
        'reminder_2025' => 'Follow up with client',
    ]);
});

test('it maps legacy priorities to normalized priority values', function () {
    $transformer = new LegacyApplicationTransformer;

    expect($transformer->mapPriority('A Low'))->toBe(1);
    expect($transformer->mapPriority('B Normal'))->toBe(2);
    expect($transformer->mapPriority('C High'))->toBe(3);
    expect($transformer->mapPriority('D Urgent'))->toBe(4);
    expect($transformer->mapPriority(''))->toBe(0);
    expect($transformer->mapPriority(null))->toBe(0);
});

test('it generates stable application numbers', function () {
    $transformer = new LegacyApplicationTransformer;

    $applicationNumber = $transformer->generateApplicationNumber('endorsement to nevada', 24010);

    expect($applicationNumber)->toBe('APP-ENDORSEMENT-TO-NEVADA-24010');
});

test('it parses csv ids safely', function () {
    $transformer = new LegacyApplicationTransformer;

    $ids = $transformer->parseCsvIds('240,239, ,abc,239,245,,');

    expect($ids)->toBe(['240', '239', '245']);
});
