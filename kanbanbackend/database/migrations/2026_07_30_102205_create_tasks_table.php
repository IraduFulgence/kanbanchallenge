<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_column')->constrained('working_board_columns')->cascadeOnDelete();
            $table->foreignId('board_id')->constrained('working_boards')->cascadeOnDelete();
            $table->string('task_title');
            $table->text('task_details');
            $table->integer('position')->default(0);
            $table->timestamp('task_duedate')->nullable();
            $table->enum('priority',['low','medium','high','critical'])->default('low');
            $table->enum('task_status',['Todo','Inprogress','Inreview','Done','Cancelled','Onhold'])->default('Todo');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
