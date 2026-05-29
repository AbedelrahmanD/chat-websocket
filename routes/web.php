<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisterController::class, 'create'])->name('register');
    Route::post('register', [RegisterController::class, 'store']);

    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');

    Route::post('profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::get('chat', [ChatController::class, 'index'])->name('chat');
    Route::get('chat/messages/{user}', [MessageController::class, 'index'])->name('messages.index');
    Route::post('chat/messages', [MessageController::class, 'store'])->name('messages.store');
    Route::put('chat/messages/{message}', [MessageController::class, 'update'])->name('messages.update');
    Route::delete('chat/messages/{message}', [MessageController::class, 'destroy'])->name('messages.destroy');
    Route::post('chat/typing', [MessageController::class, 'typing'])->name('messages.typing');
    Route::post('chat/messages/{user}/read', [MessageController::class, 'markAsRead'])->name('messages.read');
});
