import React from "react";

export default function AuthLayout({children}:{children:React.ReactNode}){
    return(
        <div className="flex flex-1 items-center justify-center bg-white dark:bg-gray-900 px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="mb-4 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-card bg-brand text-black dark:text-white font-bold">
                        Login
                    </div>
                    <h1 className="text-xl font-semibold">Kanban</h1>
                </div>
                <div className="rounded-card border border-gray-700 p-6 show-card">
                    {children}
                </div>

            </div>

        </div>
    );
}