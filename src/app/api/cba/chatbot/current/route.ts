import {NextRequest}from"next/server";import{proxy}from"../_proxy";export const GET=(r:NextRequest)=>proxy(r,"/store/cba/v1/chatbot/sessions/current","GET")
