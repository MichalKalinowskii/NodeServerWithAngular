import express, { Request, Response } from 'express';
import { fromEvent, map, Observable, tap } from 'rxjs';
import debug from 'debug';

const serverDebug = debug('app:server');
const rxDebug = debug('app:rx');

const app = express();
const port = 3000;

app.use(express.json());

// Add request logging middleware
app.use((req: Request, res: Response, next) => {
  serverDebug(`${req.method} ${req.path}`);
  serverDebug('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length) {
    serverDebug('Body:', req.body);
  }
  next();
});

const createRequestObservable = (req: Request): Observable<any> => {
  return new Observable(subscriber => {
    try {
      const data = {
        method: req.method,
        path: req.path,
        body: req.body,
        timestamp: new Date()
      };
      rxDebug('Creating observable with data:', data);
      subscriber.next(data);
      subscriber.complete();
    } catch (error) {
      rxDebug('Error in observable:', error);
      subscriber.error(error);
    }
  });
};

app.post('/api/data', (req: Request, res: Response) => {
  createRequestObservable(req).pipe(
    tap(data => rxDebug('Before transformation:', data)),
    map(data => ({
      ...data,
      processed: true
    })),
    tap(data => rxDebug('After transformation:', data))
  ).subscribe({
    next: (result) => {
      serverDebug('Sending response:', result);
      res.json(result);
    },
    error: (error) => {
      serverDebug('Error processing request:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

app.get('/health', (req: Request, res: Response) => {
  serverDebug('Health check requested');
  res.json({ status: 'okkkkk' });
});

app.listen(port, () => {
  serverDebug(`Server running at http://localhost:${port}`);
});