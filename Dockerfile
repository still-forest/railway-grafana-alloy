FROM grafana/alloy:latest

COPY alloy-config.alloy /etc/alloy/config.alloy

CMD ["run", "--config.file=/etc/alloy/config.alloy"]
