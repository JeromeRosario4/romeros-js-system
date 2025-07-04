const connection = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
  const { name, password, email } = req.body;
  
  // Validate input
  if (!name || !password || !email) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Using promise-based version instead of callback
    const [result] = await connection.promise().execute(
      'INSERT INTO users (name, password, email) VALUES (?, ?, ?)',
      [name, hashedPassword, email]
    );
    
    return res.status(201).json({
      success: true,
      result,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate email error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    return res.status(500).json({ 
      error: 'Error registering user',
      details: error.message 
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [results] = await connection.promise().execute(
      'SELECT id, name, email, password FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Remove password from response
    delete user.password;
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    return res.status(200).json({
      success: "welcome back",
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Error logging in', 
      details: error.message 
    });
  }
};

const updateUser = async (req, res) => {
  const { title, fname, lname, addressline, town, zipcode, phone, userId } = req.body;
  
  // Validate required fields
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  let image = null;
  if (req.file) {
    image = req.file.path.replace(/\\/g, "/");
  }

  const userSql = `
    INSERT INTO customer 
      (title, fname, lname, addressline, town, zipcode, phone, image_path, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      title = VALUES(title),
      fname = VALUES(fname),
      lname = VALUES(lname),
      addressline = VALUES(addressline),
      town = VALUES(town),
      zipcode = VALUES(zipcode),
      phone = VALUES(phone),
      image_path = VALUES(image_path)`;
  
  const params = [title, fname, lname, addressline, town, zipcode, phone, image, userId];

  try {
    const [result] = await connection.promise().execute(userSql, params);
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      result
    });
  } catch (error) {
    console.error('Update error:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(500).json({ 
      error: 'Error updating profile',
      details: error.message 
    });
  }
};

const deactivateUser = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const sql = 'UPDATE users SET deleted_at = ? WHERE email = ?';
  const timestamp = new Date();

  try {
    const [result] = await connection.promise().execute(sql, [timestamp, email]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      email,
      deleted_at: timestamp
    });
  } catch (error) {
    console.error('Deactivation error:', error);
    return res.status(500).json({ 
      error: 'Error deactivating user', 
      details: error.message 
    });
  }
};

module.exports = { registerUser, loginUser, updateUser, deactivateUser };