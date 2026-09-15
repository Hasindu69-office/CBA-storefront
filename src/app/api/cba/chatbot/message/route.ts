import {NextRequest}from"next/server";import{proxy}from"../_proxy";export const POST=(r:NextRequest)=>proxy(r,"/store/cba/v1/chatbot/messages")
