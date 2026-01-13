"use client";

import TopBar from '@/components/TopBar';
import { useRouter } from "next/navigation";


export default function Home() {
  const router = useRouter();
  
  return (
    <div>
    
    <TopBar Title = {"DungeonSync"} right = 
    {<div>
      <button onClick={() => router.push("/register")}>Register</button>
      <button onClick={() => router.push("/login")}>Login</button>
    </div>}/>

    </div>
  )
}