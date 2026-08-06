<?php

namespace App\Observers;

class WorkSpaceObserver
{
    //
    public function created(WorkSpace $workspace)
    {
        // Log the creation of a new workspace
        \Log::info("Workspace created: {$workspace->workspace_name} (ID: {$workspace->id})");
        //clear the owner's cache to reflect the new workspace
        $prefix = config('cache.prefix');
        $key = sprintf('%s:myworkingspace_%s', $prefix, $workspace->owner_id);
        Cache::store('redis')->forget($key);
    }
}
