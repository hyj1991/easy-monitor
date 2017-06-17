#include "tcp_client.h"

/**
 * @description 建立Tcp连接
 */
int TcpClient::TcpConnect(const char* server_ip,int server_port){
       //解析域名，如果是IP则不用解析，如果出错，显示错误信息
       if ((nlp_host=gethostbyname(server_ip))==0){
           return 0;
       }

       //初始化主机名和端口。主机名可以是IP，也可以是可被解析的名称
       //设置pin变量，包括协议、地址、端口等
       bzero(&pin,sizeof(pin));
       pin.sin_family=AF_INET;                 //AF_INET表示使用IPv4
       pin.sin_addr.s_addr=htonl(INADDR_ANY);
       pin.sin_addr.s_addr=((struct in_addr *)(nlp_host->h_addr))->s_addr;
       pin.sin_port=htons(server_port);

       //建立socket
       socket_fd=socket(AF_INET,SOCK_STREAM,0);

       //建立连接，失败返回-1
       if (connect(socket_fd, (struct sockaddr*)&pin, sizeof(pin)) == -1){
         return -1;
       }

       //成功则返回建立的socket连接描述符
       return socket_fd;
}

/**
 * @description 发送数据流
 */
int TcpClient::TcpSendMessage(const char* message){
    int send_res = send(socket_fd,message,strlen(message),0);
    return send_res;
}

/**
 * @description 接收数据流
 */
/*void TcpClient::TcpReceiveMessage(std::string str){ 
    char tmp[1000] ; 
    int n = recv(socket_fd, tmp, 100, 0); 
    tmp[n] = '\0'; 
    printf("接收的数据为 %s\n", tmp); 
}*/
