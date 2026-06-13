<?php

namespace App\Services;

use App\Models\User;
use App\Models\PushSubscription;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Illuminate\Support\Facades\Log;

class PushService
{
    /**
     * Send web push notification to all subscriptions of a recipient user.
     */
    public static function sendNotification(User $recipient, string $title, string $body, array $extraData = []): void
    {
        $subscriptions = $recipient->pushSubscriptions;

        if ($subscriptions->isEmpty()) {
            return;
        }

        // Configure VAPID authentication credentials
        $auth = [
            'VAPID' => [
                'subject' => env('VAPID_SUBJECT', 'mailto:betterbee2@gmail.com'),
                'publicKey' => env('VAPID_PUBLIC_KEY'),
                'privateKey' => env('VAPID_PRIVATE_KEY'),
            ],
        ];

        try {
            $webPush = new WebPush($auth);

            // Construct payload
            $payload = json_encode([
                'title' => $title,
                'body' => $body,
                'icon' => '/pwa-192x192.png',
                'badge' => '/favicon.svg',
                'data' => $extraData,
            ]);

            foreach ($subscriptions as $sub) {
                $subscription = Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'publicKey' => $sub->public_key,
                    'authToken' => $sub->auth_token,
                    'contentEncoding' => $sub->content_encoding ?? 'aesgcm',
                ]);

                $webPush->queueNotification($subscription, $payload);
            }

            // Flush queue and verify results
            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getEndpoint();
                if (!$report->isSuccess()) {
                    Log::warning("[PushService] Failed sending notification to {$endpoint}: {$report->getReason()}");

                    $response = $report->getResponse();
                    if ($response) {
                        $statusCode = $response->getStatusCode();
                        // 404 Not Found or 410 Gone represents expired/unsubscribed browser targets
                        if ($statusCode === 404 || $statusCode === 410) {
                            Log::info("[PushService] Deleting expired subscription: {$endpoint}");
                            PushSubscription::where('endpoint', $endpoint)->delete();
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('[PushService] WebPush exception: ' . $e->getMessage());
        }
    }
}
