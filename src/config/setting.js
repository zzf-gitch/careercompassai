/** 接口地址 */
export const API_BASE_URL = import.meta.env.VITE_API_NAME === 'development' ? import.meta.env.VITE_API_URL : window.location.origin + '/ctiapi';
// export const API_BASE_URL = window.location.origin + '/ctiapi';

/** 项目名称 */
export const PROJECT_NAME = import.meta.env.VITE_APP_NAME;