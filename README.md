- Iniciar el contenedor de rabbitmq

```bash
    docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.10-management-alpine
```

- Ejecutar los scripts de recibir y enviar mensajes

```bash
    node receive.js
```

```bash
    node send.js
```

