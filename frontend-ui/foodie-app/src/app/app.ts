import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './components/layout/footer/footer';
import { Header } from './components/layout/header/header';
import { onHome } from './shared/on-home';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  /**
   * Home is a full-width marketing page; every other route stays in the
   * centred column the shell provides.
   */
  protected readonly fullBleed = onHome();
}
