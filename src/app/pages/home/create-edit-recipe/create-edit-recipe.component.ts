import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RecipeService } from '../../../services/recipe.service';
import { IRecipe } from '../../../core/interfaces/recipe.interface';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import { ImageUploadService } from '../../../services/image.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-create-edit-recipe',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
    AsyncPipe,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-edit-recipe.component.html',
  styleUrl: './create-edit-recipe.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateEditRecipeComponent implements OnDestroy {
  private readonly router: Router = inject(Router);
  private readonly activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly imageUploadService = inject(ImageUploadService);
  private recipeService: RecipeService = inject(RecipeService);
  private snackBar = inject(MatSnackBar);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  public isLoading: boolean = false;
  private readonly sub$ = new Subject();
  public form: FormGroup = new FormGroup({
    id: new FormControl(''),
    title: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    instructions: new FormControl('', Validators.required),
    ingredients: new FormArray([new FormControl('', Validators.required)]),
    image: new FormControl('', Validators.required),
  });

  public get ingredients(): FormArray {
    return this.form.get('ingredients') as FormArray;
  }

  public addIngredient(): void {
    this.ingredients.push(new FormControl('', Validators.required));
  }
  public removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
  }

  public onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.isLoading = true;

    this.imageUploadService
      .uploadImage(file)
      .pipe(
        tap((data) => {
          const imageUrl = data?.data?.image?.url || data?.data?.url;

          if (imageUrl) {
            this.form.patchValue({ image: imageUrl });
          }
        }),
        catchError((error) => {
          this.openSnackBar(`${error.message}, try again later!`);
          return throwError(() => error.message);
        }),
        takeUntil(this.sub$)
      )
      .subscribe({
        next: (data) => {
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        complete: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  public deleteImage(): void {
    this.form.patchValue({ image: '' });
  }

  public recipe$: Observable<IRecipe> = this.activatedRoute.params.pipe(
    map((params) => params['id']),
    switchMap((id) => {
      if (id) {
        return this.recipeService.getRecipeById(id).pipe(
          tap((recipe: IRecipe) => {
            this.form.patchValue(recipe);
            this.ingredients.clear();
            recipe.ingredients.forEach((ingredient) => {
              this.ingredients.push(
                new FormControl(ingredient, Validators.required)
              );
            });
          })
        );
      }
      return of();
    })
  );

  public submitForm(): void {
    this.form.markAllAsTouched();

    const { id, title, description, image, ingredients, instructions } =
      this.form.value;

    if (id) {
      this.recipeService
        .updateRecipe({
          id,
          title,
          description,
          image,
          ingredients,
          instructions,
        } as IRecipe)
        .pipe(
          catchError(({ error }) => {
            this.openSnackBar(`${error.message},try again later!`);
            return throwError(() => error.message);
          }),
          takeUntil(this.sub$)
        )
        .subscribe(() => {
          this.openSnackBar('Recipe updated successfully!');
          this.router.navigate(['/']);
        });
    } else {
      const randomid = Math.round(Math.random() * 100000);

      this.recipeService
        .addRecipe({
          id: String(randomid),
          title,
          description,
          image,
          ingredients,
          instructions,
        } as IRecipe)
        .pipe(
          catchError(({ error }) => {
            this.openSnackBar(`${error.message},try again later!`);
            return throwError(() => error.message);
          }),
          takeUntil(this.sub$)
        )
        .subscribe(() => {
          this.openSnackBar('Recipe added successfully!');
          this.router.navigate(['/']);
        });
    }
  }

  private openSnackBar(message: string): void {
    this.snackBar.open(message, '', {
      duration: 5000,
      panelClass: 'popup',
    });
  }
  public ngOnDestroy(): void {
    this.sub$.next(null);
    this.sub$.complete();
  }
}
