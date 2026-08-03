import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginPage from "./auth/login/page";
import GuestGuard from "@/components/auth/GuestGuard";
export default  function Home(){
 return(
  <GuestGuard>
    <div className="flex min-h-screen  items-center justify-center bg-zinc-50 dark:bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
      <LoginPage />
    </div>
  </GuestGuard>
 );
}