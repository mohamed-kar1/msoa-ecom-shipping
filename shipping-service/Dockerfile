FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
ENV DB_PATH=/data/shipping.db
ENV ORDERS_URL=http://orders:8084
ENV AUTH_URL=http://auth:8081
EXPOSE 8086
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8086"]
