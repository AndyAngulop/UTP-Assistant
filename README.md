UTP ASSISTANT
=============

1. Crea un entorno virtual (opcional pero recomendado):

   python -m venv venv

2. Actívalo en Windows:

   venv\Scripts\activate

3. Instala las dependencias:

   pip install -r requirements.txt

4. Copia .env.example a .env:

   copy .env.example .env

5. Abre .env y coloca tu API key de Gemini:

   GEMINI_API_KEY=TU_API_KEY

6. Ejecuta:

   python app.py

7. Abre:

   http://127.0.0.1:5000

La aplicación utiliza SQLite para guardar prospectos, tareas y reuniones.
