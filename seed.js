const {PrismaClient}=require('@prisma/client')
const prisma= new PrismaClient()

async function main(){
    await prisma.Product.createMany({
        data:[
            {name:'Nintendo Switch', price:1},
            {name:'PS5 Pro',price:1},
            {name:'PS5',price:1},
            {name:'240 Hz monitor',price:1},
            {name:'RTX 4060',price:1},
            
        ]
    })
    console.log('Db seeded')
}

main().catch(console.error).finally(()=>prisma.$disconnect())