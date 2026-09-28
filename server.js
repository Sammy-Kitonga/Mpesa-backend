const express=require('express')
const cors=require('cors')
const axios=require('axios')
const {PrismaClient}=require('@prisma/client')
require('dotenv').config()

const app=express()
const prisma= new PrismaClient()

app.use(cors())
app.use(express.json())
app.get('/api/products', async (req, res) => {
    try {
      const products = await prisma.product.findMany();
      res.json(products);
    } catch (error) {
      console.error("DATABASE ERROR:", error);
      res.status(500).json({ error: "Failed to fetch products from database" });
    }
  });

app.post('/api/checkout',async (req,res)=>{
    const {phone,amount}=req.body

    try {
        const auth=Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
        const tokenRes=await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {headers:{Authorization:`Basic ${auth}`}}
        )
        const token=tokenRes.data.access_token

        const timestamp=new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14)
        const password=Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64')

        const order=await prisma.order.create({data:{phone,amount}})

        await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
                BusinessShortCode:process.env.MPESA_SHORTCODE,
                Password:password,
                Timestamp:timestamp,
                TransactionType: "CustomerPaybillOnline",
                Amount:amount,
                PartyA:phone,
                PartyB:process.env.MPESA_SHORTCODE,
                PhoneNumber:phone,
                CallBackURL:"https://mpesa-backend-pj42.onrender.com/api/callback",
                AccountReference:order.id,
                TransactionDesc:"E-commerce checkput"
            },
            {headers:{Authorization:`Bearer ${token}`}}
        )
        res.json({message:"STK Push sent successfully"})
    } catch(error){
        console.error(error.response?.data || error.message)
        res.status(500).json({error:"Payment failed"})
    }
})

app.post('/api/callback',(req,res)=>{
    console.log("Payment callback:", JSON.stringify(req.body,null,2))
    res.status(200).send('OK')
})

const PORT=process.env.PORT || 5000
app.listen(PORT,()=>console.log(`Backend running on port ${PORT}`))