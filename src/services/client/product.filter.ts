import { prisma } from "config/client";
const userFilter = async (username:string) => {
    return  await prisma.user.findMany({
        where: {
            username: {
                contains: username,
            }
        }
    });
}

// ### ***Yêu cầu 1:*** [http://localhost:8080/products?**minPrice**=1000000](http://localhost:8080/products?minPrice=1000000)

// Lấy ra tất cả sản phẩm có giá (price) tối thiểu là 1.000.000 (vnd)

const yeuCau1 = async (minPrice: number) => {
    return await prisma.product.findMany({
        where: {
            price: {
                gte: minPrice
            }
        }
    });
}


// **Yêu cầu 2:** [http://localhost:8080/products?**maxPrice**=15000000](http://localhost:8080/products?maxPrice=15000000)
// Lấy ra tất cả sản phẩm có giá (price) tối đa  là 15.000.000 (vnd)

const yeuCau2 = async (maxPrice: number) => {
    return await prisma.product.findMany({
        where: {
            price: {
                lte: maxPrice
            }
        }
    });
}

// **Yêu cầu 3:** [http://localhost:8080/products?**factory**=**APPLE**](http://localhost:8080/products?factory=APPLE)
// Lấy ra tất cả sản phẩm có hãng sản xuất = APPLE

const yeuCau3 = async (factory: string) => {
    return await prisma.product.findMany({
        where: {
            factory: factory
        }
    });
}

// **Yêu cầu 4:** [http://localhost:8080/products?**factory**=**APPLE,DELL**](http://localhost:8080/products?factory=APPLE,DELL)
// Lấy ra tất cả sản phẩm có hãng sản xuất = APPLE hoặc DELL . Truyền nhiều điều kiện, ngăn cách các giá trị bởi dấu phẩy (điều kiện IN)

const yeuCau4 = async (factories: string[]) => {
    return await prisma.product.findMany({
        where: {
            factory: {
                in: factories
            }
        }
    });
}

// **Yêu cầu 5:** [http://localhost:8080/products?**price**=10-toi-15-trieu](http://localhost:8080/products?price=10-toi-15-trieu)
// Lấy ra tất cả sản phẩm theo range (khoảng giá).  10 triệu <= price <= 15 triệu

const yeuCau5 = async (minPrice: number, maxPrice: number) => {
    return await prisma.product.findMany({
        where: {
            price: {
                gte: minPrice,
                lte: maxPrice
            }
        }
    });
}
// **Yêu cầu 6:** [http://localhost:8080/products?**price**=10-toi-15-trieu,16-toi-20-trieu](http://localhost:8080/products?price=10-toi-15-trieu,16-toi-20-trieu)
// Lấy ra tất cả sản phẩm theo range (khoảng giá).  10 triệu <= price <= 15 triệu và 16 triệu <= price <= 20 triệu

const yeuCau6 = async (priceRanges: [number, number][]) => {
    const orConditions = priceRanges.map(([minPrice, maxPrice]) => ({
        price: {
            gte: minPrice,
            lte: maxPrice
        }
    }));

    return await prisma.product.findMany({
        where: {
            OR: orConditions
        }
    });
}

// **Yêu cầu 7:** [http://localhost:8080/products?**sort**=price,asc](http://localhost:8080/products?sort=price,asc)
// Lấy ra tất cả sản phẩm và sắp xếp theo giá tăng dần

const yeuCau7 = async (sortField: string, sortOrder: 'asc' | 'desc') => {
    return await prisma.product.findMany({
        orderBy: {
            [sortField]: sortOrder
        }
    });
}   

const productFilterService = async (
    page: number,
    pageSize: number,
    factory?: string,
    target?: string,
    price?: string,
    sort?: string
) => {
    //build where query
    let whereClause: any = {};
    let andConditions: any[] = [];

    if(factory){
        const factoryInput = factory.split(',');
        // Use AND to combine: factory must be in list AND factory must not be null
        andConditions.push({
            AND: [
                { factory: { in: factoryInput } },
                { factory: { not: null } }
            ]
        });
    }
    if(target){
        const targetInput = target.split(',');
        andConditions.push({
            AND: [
                { target: { in: targetInput } },
                { target: { not: null } }
            ]
        });
    }
    if(price){
        // Parse price ranges like "duoi-10-trieu,10-15-trieu,15-20-trieu,tren-20-trieu"
        const priceMapping: { [key: string]: [number, number] } = {
            'duoi-10-trieu': [0, 10000000],
            '10-15-trieu': [10000000, 15000000],
            '15-20-trieu': [15000000, 20000000],
            'tren-20-trieu': [20000000, 999999999]
        };

        const priceRanges = price.split(',').filter(p => priceMapping[p]);
        
        if(priceRanges.length > 0){
            const orConditions = priceRanges.map(range => {
                const [minPrice, maxPrice] = priceMapping[range];
                return {
                    price: {
                        gte: minPrice,
                        lte: maxPrice
                    }
                };
            });
            
            andConditions.push({
                OR: orConditions
            });
        }
    }

    // Combine all conditions with AND
    if (andConditions.length > 0) {
        whereClause.AND = andConditions;
    }

    //build sort query
    let orderByClause: any = undefined;
    if(sort){
        if(sort === 'gia-tang-dan'){
            orderByClause = { price: 'asc' };
        } else if(sort === 'gia-giam-dan'){
            orderByClause = { price: 'desc' };
        }
    }

    const skip = (page - 1) * pageSize;

    const products = await prisma.product.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip: skip,
        take: pageSize
    });

    return products;
};

// Count filtered products for pagination
const countFilteredProducts = async (
    factory?: string,
    target?: string,
    price?: string
) => {
    let whereClause: any = {};
    let andConditions: any[] = [];

    if(factory){
        const factoryInput = factory.split(',');
        andConditions.push({
            AND: [
                { factory: { in: factoryInput } },
                { factory: { not: null } }
            ]
        });
    }
    if(target){
        const targetInput = target.split(',');
        andConditions.push({
            AND: [
                { target: { in: targetInput } },
                { target: { not: null } }
            ]
        });
    }
    if(price){
        const priceMapping: { [key: string]: [number, number] } = {
            'duoi-10-trieu': [0, 10000000],
            '10-15-trieu': [10000000, 15000000],
            '15-20-trieu': [15000000, 20000000],
            'tren-20-trieu': [20000000, 999999999]
        };

        const priceRanges = price.split(',').filter(p => priceMapping[p]);
        
        if(priceRanges.length > 0){
            const orConditions = priceRanges.map(range => {
                const [minPrice, maxPrice] = priceMapping[range];
                return {
                    price: {
                        gte: minPrice,
                        lte: maxPrice
                    }
                };
            });
            
            andConditions.push({
                OR: orConditions
            });
        }
    }

    // Combine all conditions with AND
    if (andConditions.length > 0) {
        whereClause.AND = andConditions;
    }

    return await prisma.product.count({
        where: whereClause
    });
};

export { userFilter, yeuCau1, yeuCau2, yeuCau3, yeuCau4, yeuCau5, yeuCau6, yeuCau7, productFilterService, countFilteredProducts };