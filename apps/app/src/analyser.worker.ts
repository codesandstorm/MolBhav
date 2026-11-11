/**
 * The analyser's Web Worker (D10a): the amount parser and rules run here, off the main
 * thread, on the device. This file makes no network requests.
 */
import { serve, type PortLike } from '@molbhav/analyser/serve';

serve(self as unknown as PortLike);
