<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Bootstrap\LoadConfiguration;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        foreach (['config.php', 'events.php', 'routes-v7.php'] as $cachedFile) {
            $cachedPath = dirname(__DIR__).'/bootstrap/cache/'.$cachedFile;

            if (is_file($cachedPath) && ! unlink($cachedPath)) {
                throw new RuntimeException("Cache [{$cachedFile}] tidak dapat dihapus sebelum test dijalankan.");
            }
        }

        $_ENV['APP_ENV'] = 'testing';
        $_SERVER['APP_ENV'] = 'testing';
        putenv('APP_ENV=testing');

        $application = parent::createApplication();
        $application->afterBootstrapping(LoadConfiguration::class, function (Application $app): void {
            $connection = (string) $app['config']->get('database.default');
            $database = (string) $app['config']->get("database.connections.{$connection}.database");

            if (! $app->environment('testing') || $connection !== 'sqlite' || $database !== ':memory:') {
                throw new RuntimeException(
                    "Test dibatalkan: database harus sqlite :memory:, saat ini [{$connection}:{$database}].",
                );
            }
        });

        return $application;
    }

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }
}
