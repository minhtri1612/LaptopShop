import getConnection from 'config/database';

const handleCreateUser = async(
    fullName: string, 
    email: string, 
    address: string) => {

    //insert into database
    const connection = await getConnection();

        try {
            const sql = 'INSERT INTO users (name, email, address) VALUES (?, ?, ?)';
            const values = [fullName, email, address];

            const [result, fields] = await connection.query(sql, values);
            return result;
    } catch (error) {
        console.log(">>> Error:", error);
        return [];
    }
};

const getAllUser = async() => {
    const connection = await getConnection();


    try {
        const [result, fields] = await connection.query(
            'SELECT * FROM users'
        );
        return result;
    } catch (error) {
        console.log(">>> Error:", error);
        return [];
    }

};

const handleDeleteUser = async(id: string) => {
    const connection = await getConnection();

    try {
        const sql = 'DELETE FROM users WHERE id = ? LIMIT 1';
        const values = [id];

        const [result, fields] = await connection.execute(sql, values);
        return result;
    } catch (error) {
        console.log(">>> Error:", error);
        return [];
    }
};

const getUserById = async(id: string) => {
    const connection = await getConnection();

    try {
        const sql = 'SELECT * FROM users WHERE id = ? LIMIT 1';
        const values = [id];

        const [result, fields] = await connection.execute(sql, values);
        return result;
    } catch (error) {
        console.log(">>> Error:", error);
        return [];
    }
};

const updateUserById = async(id: string, 
    email: string, address: string, fullName: string
) => {
    try {
        const connection = await getConnection();
        const sql = 'UPDATE users SET name = ?, email = ?, address = ? WHERE id = ? LIMIT 1';
        const values = [fullName, email, address, id];

        const [result, fields] = await connection.execute(sql, values);
        return result;
    } catch (error) {
        console.log(">>> Error:", error);
        return [];
    }
};


export { handleCreateUser, getAllUser, handleDeleteUser, getUserById, updateUserById };