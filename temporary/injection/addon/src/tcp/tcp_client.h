#include <sys/socket.h>
#include <sys/types.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <string>

class TcpClient
{
    private:
        struct sockaddr_in pin;
        struct hostent *nlp_host;
        int socket_fd;

    public:
        int TcpConnect(const char* server_ip, int server_port);
        int TcpSendMessage(const char* message);
        void TcpReceiveMessage(std::string str);
};