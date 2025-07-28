const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const Book = require('../graphql-server/models/book');
const cors = require('cors');
const playground = require('graphql-playground-middleware-express').default;

const app = express();                                        // Khởi tạo ứng dụng Express

// Kết nối MongoDB tới database "bookstore" trên localhost
mongoose.connect('mongodb://localhost:27017/bookstore', {
  useNewUrlParser: true,                                      // Sử dụng cú pháp phân tích URL mới
  useUnifiedTopology: true                                    // Dùng engine kết nối mới của MongoDB
})
  .then(() => console.log('✅ Đã kết nối MongoDB'))          // Log khi kết nối thành công
  .catch(err => console.error('❌ MongoDB lỗi:', err));      // Log lỗi nếu không kết nối được

// Cấu hình CORS để cho phép frontend (ở localhost:3000) truy cập backend
app.use(cors({
  origin: 'http://localhost:3000',                           // Cho phép truy cập từ địa chỉ này
  methods: ['GET', 'POST', 'PUT', 'DELETE'],                 // Các phương thức HTTP được phép
  allowedHeaders: ['Content-Type']                           // Cho phép header "Content-Type"
}));

// Định nghĩa schema GraphQL
const schema = buildSchema(`
  type Book {
    id: ID!
    title: String!
    author: String!
  }

  input BookInput {
    title: String!
    author: String!
  }

  type Query {
    hello: String
    books: [Book]
    getBookById(id: ID!): Book
  }

  type Mutation {
    addBook(input: BookInput!): Book
    updateBook(id: ID!, input: BookInput!): Book
    deleteBook(id: ID!): String
  }
`);
// Giải thích:
// - Book: định nghĩa kiểu dữ liệu Book trả về
// - BookInput: định nghĩa kiểu input khi thêm/cập nhật sách
// - Query: các truy vấn dữ liệu (GET)
// - Mutation: các hành động thay đổi dữ liệu (POST, PUT, DELETE)

// Định nghĩa các hàm xử lý tương ứng với schema GraphQL
const root = {
  hello: () => 'Hello từ GraphQL + MongoDB',                   // Trả về chuỗi hello đơn giản

  books: async () => await Book.find(),                        // Lấy tất cả sách trong database

  getBookById: async ({ id }) => await Book.findById(id),      // Lấy 1 cuốn sách theo id

  addBook: async ({ input }) => {
    const newBook = new Book(input);                           // Tạo đối tượng sách mới từ input
    return await newBook.save();                               // Lưu vào MongoDB
  },

  updateBook: async ({ id, input }) => {
    const updated = await Book.findByIdAndUpdate(id, input, { new: true }); // Cập nhật sách theo id
    if (!updated) throw new Error('Không tìm thấy sách.');                  // Nếu không tìm thấy thì báo lỗi
    return updated;                                                         // Trả về sách đã cập nhật
  },

  deleteBook: async ({ id }) => {
    const deleted = await Book.findByIdAndDelete(id);         // Xóa sách theo id
    if (!deleted) throw new Error('Không tìm thấy sách.');    // Nếu không có sách thì báo lỗi
    return `Đã xóa sách có id = ${id}`;                       // Trả về thông báo xóa thành công
  }
};

// Tạo endpoint cho GraphQL (giao tiếp với frontend) 
app.use('/graphql', graphqlHTTP({  schema,  rootValue: root, graphiql: false,}));

// Tạo đường dẫn riêng cho GraphQL Playground để test API
app.get('/playground', playground({ endpoint: '/graphql' }));

// Khởi động server tại port 4000
app.listen(4000, () => {
  console.log('🚀 Server GraphQL: http://localhost:4000/playground'); // Thông báo khi server chạy
});