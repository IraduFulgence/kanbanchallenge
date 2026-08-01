import { Metadata } from "next";
import RegisterComponent from "@/components/auth/RegisterComponent";
import GuestGuard from "@/components/auth/GuestGuard";
export const metadata:Metadata={
    title:"Register-Kanban",
    description:"Registration page for our parent project"
}

export default function RegisterPage(){
    return(
        <GuestGuard>
            <RegisterComponent />
        </GuestGuard>
    );
}
