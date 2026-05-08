import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path';
// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

export default defineConfig(({ command }) => {
  // 打印当前执行的命令（serve用于开发，build用于生产）
  console.log("当前命令:" + command)

  // // 根据当前命令设置基础公共路径
  // // 开发环境使用相对路径，生产环境使用/dist/
  // let base = command === 'serve' ? './' : './'

  // // 生产环境特殊处理，设置不同的基础路径
  // if (command === 'build') {
  //   base = './'
  // }

  // 配置路径别名，方便模块导入
  const alias = {
    '@/': resolve('src') + '/',
  };

  return {
    plugins: [react()],
    // 路径别名配置
    resolve: { alias },
    // 部署基础路径配置
    // base: base,
    base: './',
    // 开发服务器配置
    server:{
      port: 4090, // 指定开发服务器端口号
      strictPort: false, // 端口被占用时是否尝试其他端口
      cors: true, // 开启CORS跨域支持
    }
  }
})