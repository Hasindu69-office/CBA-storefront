import crypto from "crypto"
import { cookies,headers } from "next/headers"
import { NextRequest,NextResponse } from "next/server"
const COOKIE="_cba_chatbot_session"
const backend=(process.env.MEDUSA_BACKEND_URL||process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL||"http://localhost:9000").replace(/\/$/,"")
export async function proxy(req:NextRequest,path:string,method="POST"){
  if(method!=="GET"&&!req.headers.get("content-type")?.includes("application/json"))return NextResponse.json({error:{message:"JSON content type is required."}},{status:415})
  const hs=await headers();const cs=await cookies();const token=cs.get(COOKIE)?.value;const secret=process.env.CBA_CHATBOT_BFF_SHARED_SECRET||""
  const publishableKey=process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY||""
  const ip=hs.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";const ipHash=crypto.createHmac("sha256",secret||"development").update(ip).digest("hex")
  const body=method==="GET"?undefined:await req.text();if(body&&body.length>10000)return NextResponse.json({error:{message:"Request is too large."}},{status:413})
  const r=await fetch(`${backend}${path}`,{method,body,cache:"no-store",headers:{"content-type":"application/json","x-publishable-api-key":publishableKey,"x-cba-chatbot-token":token||"","x-cba-chatbot-bff":secret,"x-cba-client-ip-hash":ipHash,...(hs.get("authorization")?{authorization:hs.get("authorization")!}:{})}})
  const data=r.status===204?null:await r.json().catch(()=>({error:{message:"Assistant unavailable."}}));const sessionToken=data?.token;if(data?.token)delete data.token;const out=data===null?new NextResponse(null,{status:r.status}):NextResponse.json(data,{status:r.status});out.headers.set("Cache-Control","no-store")
  if(sessionToken){out.cookies.set(COOKIE,sessionToken,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/api/cba/chatbot",maxAge:60*60*24})}
  return out
}
