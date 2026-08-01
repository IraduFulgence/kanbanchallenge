import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginPage from "./auth/login/page";
import GuestGuard from "@/components/auth/GuestGuard";
export default  function Home(){
 return(
  <GuestGuard>
    <LoginPage />
  </GuestGuard>
 );
}