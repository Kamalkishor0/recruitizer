"use client";
// We could have used the context directly
// but this is a cleaner abstraction and put every hooks in hooks folder
import { useAuthContext } from "@/context/AuthContext";

export default function useAuth() {
	return useAuthContext();
}
