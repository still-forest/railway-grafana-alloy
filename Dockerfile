FROM grafana/alloy:latest

COPY alloy-config.alloy /etc/alloy/config.alloy

EXPOSE 3100 9090

CMD ["run", "/etc/alloy/config.alloy"]
